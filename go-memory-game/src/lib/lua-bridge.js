import * as fengari from 'fengari-web'

let lua = null
let luaGlobal = null

export async function initLua() {
  if (lua) return lua

  // Create Lua state
  lua = fengari.lauxlib.luaL_newstate()
  fengari.lualib.luaL_openlibs(lua)

  // Load JS library using luaL_requiref for proper interop
  fengari.lauxlib.luaL_requiref(
    lua,
    fengari.to_luastring("js"),
    fengari.interop.luaopen_js,
    1
  )
  fengari.lua.lua_pop(lua, 1)

  // Helper to get global
  luaGlobal = {
    get: (name) => {
      fengari.lua.lua_getglobal(lua, fengari.to_luastring(name))
      const value = fengari.interop.tojs(lua, -1)
      fengari.lua.lua_pop(lua, 1)
      return value
    },
    set: (name, value) => {
      fengari.interop.push(lua, value)
      fengari.lua.lua_setglobal(lua, fengari.to_luastring(name))
    }
  }

  return { lua, luaGlobal }
}

export function loadLuaCode(code) {
  if (!lua) throw new Error('Lua not initialized')

  const result = fengari.lauxlib.luaL_dostring(
    lua,
    fengari.to_luastring(code)
  )

  if (result !== fengari.lua.LUA_OK) {
    const error = fengari.lua.lua_tojsstring(lua, -1)
    fengari.lua.lua_pop(lua, 1)
    throw new Error(`Lua error: ${error}`)
  }
}

// Helper function to convert Lua table to JS object/array (recursive)
function luaTableToJS(L, index) {
  const tempResult = {}
  const keys = []

  // Adjust index to absolute position since we'll be pushing values
  if (index < 0) {
    index = fengari.lua.lua_gettop(L) + index + 1
  }

  // Push nil as first key for lua_next
  fengari.lua.lua_pushnil(L)

  // Traverse the table
  while (fengari.lua.lua_next(L, index) !== 0) {
    // Key is at -2, value is at -1
    const key = fengari.interop.tojs(L, -2)
    keys.push(key)

    // Check if value is also a table - if so, recurse
    const valueType = fengari.lua.lua_type(L, -1)
    let value

    if (valueType === fengari.lua.LUA_TTABLE) {
      // Recursively convert nested table
      value = luaTableToJS(L, -1)
    } else {
      // Use standard conversion for non-table values
      value = fengari.interop.tojs(L, -1)
    }

    tempResult[key] = value

    // Pop value, keep key for next iteration
    fengari.lua.lua_pop(L, 1)
  }

  // Check if this is an array (sequential integer keys starting from 1)
  const isArray = keys.length > 0 && keys.every((k, i) => k === i + 1)

  if (isArray) {
    // Convert to JavaScript array (0-indexed)
    const arr = []
    for (let i = 1; i <= keys.length; i++) {
      arr.push(tempResult[i])
    }
    return arr
  } else {
    // Return as object
    return tempResult
  }
}

export function callLuaFunction(functionName, ...args) {
  if (!lua) throw new Error('Lua not initialized')

  const L = lua

  fengari.lua.lua_getglobal(L, fengari.to_luastring(functionName))

  // Push arguments
  for (let arg of args) {
    fengari.interop.push(L, arg)
  }

  // Call function - expect 1 return value
  const callResult = fengari.lua.lua_pcall(L, args.length, 1, 0)

  if (callResult !== fengari.lua.LUA_OK) {
    const error = fengari.lua.lua_tojsstring(L, -1)
    fengari.lua.lua_pop(L, 1)
    throw new Error(`Lua error: ${error}`)
  }

  // Check what type we got back
  const resultType = fengari.lua.lua_type(L, -1)
  let returnValue

  if (resultType === fengari.lua.LUA_TTABLE) {
    // Manually convert table to avoid proxy wrapper
    returnValue = luaTableToJS(L, -1)
  } else {
    // For non-tables, use standard conversion
    returnValue = fengari.interop.tojs(L, -1)
  }

  fengari.lua.lua_pop(L, 1)

  return returnValue
}

export function getLuaGlobal(name) {
  return luaGlobal ? luaGlobal.get(name) : null
}

export function setLuaGlobal(name, value) {
  if (luaGlobal) luaGlobal.set(name, value)
}
