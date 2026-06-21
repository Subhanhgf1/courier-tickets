// lib/auth.js

export const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("courierAccessToken")
  }
  return null
}

export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("courierUser")
    return user ? JSON.parse(user) : null
  }
  return null
}

export const saveSession = (token, user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("courierAccessToken", token)
    localStorage.setItem("courierUser", JSON.stringify(user))
  }
}

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("courierAccessToken")
    localStorage.removeItem("courierUser")
    window.location.href = "/login"
  }
}
