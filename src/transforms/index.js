export const Number = (val) => {
    return val.match(/\d+/) * 1
}

export const String = (val) => {
    return val.toString()
}

export const Currency = (val, dp = 2) => {
    return parseFloat(val).toFixed(dp)
}