const React = require('react')
const { Text } = require('react-native')

const FontAwesome5 = ({ name, size, color, testID, ...props }) =>
  React.createElement(Text, { testID: testID ?? `icon-${name}`, ...props })

FontAwesome5.glyphMap = {}
module.exports = FontAwesome5
module.exports.default = FontAwesome5
