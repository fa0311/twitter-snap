/* eslint-disable no-undef */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/') {
    document.querySelector('#submit').addEventListener('click', () => {
      const type = document.querySelector('#type').value
      const queryParams = new URLSearchParams({
        url: document.querySelector('#url').value,
        theme: document.querySelector('#theme').value,
        width: document.querySelector('#width').value,
        scale: document.querySelector('#scale').value,
      })

      window.location.href = `/${type}?${queryParams.toString()}`
    })
  }
})
