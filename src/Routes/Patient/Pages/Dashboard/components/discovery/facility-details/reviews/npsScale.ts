export const NPS_SCORES: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const isPromoter = (score: number): boolean => score >= 9
export const isDetractor = (score: number): boolean => score <= 6
export const isPassive = (score: number): boolean => score === 7 || score === 8
