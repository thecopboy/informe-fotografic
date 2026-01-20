/**
 * Servei d'utilitats per a la gestió de dates i hores.
 */
export class DateTimeService {
    /**
     * Retorna la data i hora actuals en un objecte.
     * @returns {{currentDate: string, currentTime: string}}
     */
    static getCurrentDateTime() {
        const now = new Date();
        
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        return { currentDate, currentTime };
    }
} 