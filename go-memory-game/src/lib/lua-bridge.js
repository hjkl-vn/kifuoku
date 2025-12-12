import * as fengari from 'fengari-web'

let lua = null
let luaGlobal = null

export async function initLua() {
  if (lua) return lua

  // Create Lua state
  lua = fengari.lauxlib.luaL_newstate()
  fengari.lualib.luaL_openlibs(lua)

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

export function callLuaFunction(functionName, ...args) {
  if (!lua) throw new Error('Lua not initialized')

  fengari.lua.lua_getglobal(lua, fengari.to_luastring(functionName))

  // Push arguments
  args.forEach(arg => fengari.interop.push(lua, arg))

  // Call function
  const result = fengari.lua.lua_pcall(lua, args.length, 1, 0)

  if (result !== fengari.lua.LUA_OK) {
    const error = fengari.lua.lua_tojsstring(lua, -1)
    fengari.lua.lua_pop(lua, 1)
    throw new Error(`Lua error: ${error}`)
  }

  // Get result
  const returnValue = fengari.interop.tojs(lua, -1)
  fengari.lua.lua_pop(lua, 1)

  return returnValue
}

export function getLuaGlobal(name) {
  return luaGlobal ? luaGlobal.get(name) : null
}

export function setLuaGlobal(name, value) {
  if (luaGlobal) luaGlobal.set(name, value)
}
