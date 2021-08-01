export const extractMotUnderline = (str, mot) => {
    let newStr = str
    .split(' ')
    .filter(word => word !== mot)
    .join(' ')

    return newStr
}

export function validate(choice, cookie) {
  const choices = Object.keys(choice)
  const chosen = Object.keys(cookie.choices)

  if (chosen.length !== choices.length) {
    return false
  }

  return chosen.every(c => choices.includes(c))
}