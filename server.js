const express = require('express')
const parser = require('body-parser')

const app = express()
const PORT = 3000

app.listen(PORT, (error) => {
  if (error) {
    console.log(error)
  } else {
    console.log('SERVER CONNECTED')
  }
})