export const extractMotUnderline = (str, mot) => {
    let newStr = str
    .split(' ')
    .filter(word => word !== mot)
    .join(' ')

    return newStr
}