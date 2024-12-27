/* eslint-disable no-undef */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/') {
    document.querySelector('#submit').addEventListener('click', () => {
      const type = document.querySelector('#type').value
      const url = document.querySelector('#url').value
      const theme = document.querySelector('#theme').value

      const queryParams = new URLSearchParams({
        url,
        theme,
      })

      window.location.href = `/${type}?${queryParams.toString()}`
    })
  }
})
