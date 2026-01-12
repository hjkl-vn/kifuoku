import PropTypes from 'prop-types'

export default function UnderConstruction({ title }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-10">
      <h1 className="text-3xl m-0 mb-4">{title}</h1>
      <p className="text-lg text-gray-500 m-0">This feature is coming soon.</p>
    </div>
  )
}

UnderConstruction.propTypes = {
  title: PropTypes.string.isRequired
}
