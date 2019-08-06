# d2l-program-outcomes-picker

A Lit Element webcomponent for importing learning outcomes from programs.

## Usage

### Attributes

`registry-id`: The registryId of the course or program to which the outcomes will be imported  
`programs`: A JSON-encoded array of objects with `name` and `registryId` properties, corresponding to the name and registryId of every program that can be imported from  
`loresEndpoint`: The endpoint of the Lores service  
`outcomeTerm` *(Optional)*: Which lang term to use for outcomes. Valid values are `competencies`, `expectations`, `objectives`, `outcomes`, and `standards`. Default is `standards`

### Events

The component emits the following events:

`d2l-program-outcomes-picker-cancel`: The close or cancel button was clicked.  
`d2l-program-outcomes-picker-import`: The import was completed successfully. The `detail.newRegistryContents` property of the event contains the new registry contents.
