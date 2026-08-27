export const WASHER_MODES = [
  { id: 'normal', label: 'Normal', minutes: 30 },
  { id: 'extra_wash', label: 'Extra Wash', minutes: 35 },
  { id: 'extra_rinse', label: 'Extra Rinse', minutes: 42 },
]

export const DRYER_MODES = [
  { id: 'normal', label: 'Normal', minutes: 30 },
  { id: 'extra_dry', label: 'Extra Dry', minutes: 40 },
]

export const NUM_WASHERS = 6
export const NUM_DRYERS = 6

export const ADMIN_PASSWORD = 'James123#'

// machine.status values:
// 'idle'               -> free, anyone may start it
// 'running'             -> cycle in progress, only the starter can cancel
// 'awaiting_collection' -> cycle finished, waiting for starter to act
// 'on_the_way'          -> starter tapped "On the Way"
// 'locked'              -> admin has manually locked it, no one may start it
