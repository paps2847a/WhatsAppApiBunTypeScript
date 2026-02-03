export default class Randomizer {
    private static readonly MIN_SECONDS = 2;
    private static readonly MAX_SECONDS = 10;
    private static readonly MS_PER_SECOND = 1000;

    /**
     * Genera un número aleatorio de milisegundos entre 2 y 10 segundos
     * @returns Número de milisegundos (2000-10000)
     */
    static getRandomDelay(): number {
        const randomSeconds = Math.random() * (this.MAX_SECONDS - this.MIN_SECONDS) + this.MIN_SECONDS;
        return Math.floor(randomSeconds * this.MS_PER_SECOND);
    }

    /**
     * Genera un número aleatorio de segundos entre 2 y 10
     * @returns Número de segundos (2-10)
     */
    static getRandomSeconds(): number {
        return Math.random() * (this.MAX_SECONDS - this.MIN_SECONDS) + this.MIN_SECONDS;
    }

    /**
     * Genera un número entero aleatorio de segundos entre 2 y 10
     * @returns Número entero de segundos (2-10)
     */
    static getRandomSecondsInt(): number {
        return Math.floor(Math.random() * (this.MAX_SECONDS - this.MIN_SECONDS + 1)) + this.MIN_SECONDS;
    }
}
