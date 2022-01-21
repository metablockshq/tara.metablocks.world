import { defAtom } from '@thi.ng/atom'
import { networks } from '../config'

const state = defAtom({
  selectedNetworkId: 'devnet',
  selectedNetwork: networks.find((n) => n.id === 'devnet'),
})

const switchNetwork = (network) =>
  state.swap((s) => ({
    ...s,
    selectedNetworkId: network,
    selectedNetwork: networks.find((n) => n.id === network),
  }))

export default state
export { switchNetwork }
