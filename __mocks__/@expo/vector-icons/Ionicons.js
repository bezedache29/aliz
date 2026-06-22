const React = require('react')
const { Text } = require('react-native')

const Ionicons = ({ name, size, color, testID, ...props }) =>
  React.createElement(Text, { testID: testID ?? `icon-${name}`, ...props })

Ionicons.glyphMap = {}
module.exports = Ionicons
module.exports.default = Ionicons
