// import { makeDOMDriver } from '@cycle/dom'
import { WithDriver } from '#components/Driver.js'
import { classModule } from 'snabbdom/modules/class'
import { propsModule } from 'snabbdom/modules/props'
import { attributesModule } from 'snabbdom/modules/attributes'
import { styleModule } from 'snabbdom/modules/style'
import { datasetModule } from 'snabbdom/modules/dataset'
import { cssModule } from './modules/css.js'
import { DomDriver } from './DomDriver.js'





export const WithDomRenderer = ({
  name = 'DOM',
  rootSelector = 'body',
  ...options
} = {}) => WithDriver({
  name,
  driver: DomDriver(rootSelector, {
    modules: [
      propsModule,
      styleModule,
      cssModule,
      classModule,
      attributesModule,
      datasetModule,
    ],
    ...options
  })
})
