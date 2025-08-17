import base from '@aamini/config-eslint/base'
import pluginTanstack from '@tanstack/eslint-plugin-query'

export default [...base, pluginTanstack.configs['flat/recommended']]
