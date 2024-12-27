import {reactRenderer} from '@hono/react-renderer'
import * as React from 'react'

export const renderer = reactRenderer(({children}) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
        <script src="/static/client.js" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
})
