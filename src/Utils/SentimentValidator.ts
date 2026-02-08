export enum SentimentType {
    POSITIVE = 'POSITIVE',
    NEGATIVE = 'NEGATIVE',
    NEUTRAL = 'NEUTRAL'
}

export default class SentimentValidator {
    // Frases que indican claramente una intención negativa
    private static readonly STRONG_NEGATIVE_PHRASES = [
        'no usare', 'no voy', 'no necesito', 'no ocupo', 'no requiero',
        'no puedo', 'no ire', 'no lo usare', 'no lo necesito',
        'hoy no', 'no confirmo', 'negativo', 'cancelo', 'no gracias',
        'baja', 'sacame', 'no cuentes conmigo', 'paso', 'no asisto',
        'no subo', 'no me esperen'
    ];
    
    // Frases que indican claramente una intención positiva
    private static readonly STRONG_POSITIVE_PHRASES = [
        'si usare', 'si voy', 'si necesito', 'si ocupo', 'si requiero',
        'si ire', 'claro que si', 'cuenta conmigo', 'anotame', 'apuntame',
        'presente', 'listo', 'voy a ir', 'voy a usar', 'confirmado',
        'confirmo', 'afirmativo', 'si por favor', 'llevame', 'pasame buscando'
    ];

    // Palabras sueltas de acción (requieren análisis de contexto)
    private static readonly ACTION_VERBS = [
        'usare', 'voy', 'necesito', 'ocupo', 'requiero', 'ire', 
        'asisto', 'subo', 'espero'
    ];

    // Palabras de afirmación simples
    private static readonly AFFIRMATIONS = [
        'si', 'claro', 'ok', 'vale', 'va', 'bueno', 'simon', 'yes'
    ];

    // Palabras que indican contexto de transporte
    private static readonly TRANSPORT_CONTEXT = [
        'transporte', 'viaje', 'ruta', 'bus', 'carro', 'vehiculo',
        'llevar', 'recoger', 'pasar', 'servicio', 'turno', 'camioneta'
    ];

    // Palabras de negación
    private static readonly NEGATION_WORDS = [
        'no', 'nunca', 'jamas', 'tampoco', 'ni', 'sin'
    ];

    // Palabras de duda (generan Neutral)
    private static readonly DOUBT_WORDS = [
        'tal vez', 'quizas', 'no se', 'dudo', 'puede ser', 'luego aviso',
        'pendiente', 'veremos', 'aviso'
    ];

    /**
     * Valida la intención de uso del servicio de transporte
     * @param msg Mensaje del usuario
     * @returns SentimentType (POSITIVE, NEGATIVE, NEUTRAL)
     */
    public static ValidateSentiment(msg: string): SentimentType {
        if (!msg?.trim()) return SentimentType.NEUTRAL;

        const normalized = this.normalizeText(msg);
        
        // 0. Detección de duda explícita -> NEUTRAL
        if (this.containsPhrase(normalized, this.DOUBT_WORDS)) {
            return SentimentType.NEUTRAL;
        }

        // 1. Detección directa por frases fuertes (Alta prioridad)
        if (this.containsPhrase(normalized, this.STRONG_NEGATIVE_PHRASES)) {
            return SentimentType.NEGATIVE;
        }
        
        if (this.containsPhrase(normalized, this.STRONG_POSITIVE_PHRASES)) {
            return SentimentType.POSITIVE;
        }

        // 2. Análisis de verbos de acción con negación cercana
        const hasAction = this.containsWord(normalized, this.ACTION_VERBS);
        const hasNegation = this.containsWord(normalized, this.NEGATION_WORDS);

        if (hasAction) {
            if (hasNegation) {
                // Si hay acción y negación, pero no cayó en STRONG_NEGATIVE, es ambiguo.
                // Ej: "No se si voy" -> Neutral.
                // Ej: "No, si voy" -> Complejo, mejor Neutral para que intervenga humano o se pida aclaración.
                return SentimentType.NEUTRAL;
            }
            // Acción sin negación ("Voy", "Usaré") -> Positivo
            return SentimentType.POSITIVE;
        }

        // 3. Respuestas cortas afirmativas (Ej: "Si", "Claro")
        const hasAffirmation = this.containsWord(normalized, this.AFFIRMATIONS);
        if (hasAffirmation) {
            // Si el mensaje es corto (< 5 palabras) y tiene afirmación, asumimos positivo
            // Ej: "Si", "Si gracias", "Claro que si"
            const wordCount = normalized.split(' ').length;
            if (wordCount <= 5) {
                if (hasNegation) return SentimentType.NEGATIVE; // "No, gracias"
                return SentimentType.POSITIVE;
            }
            
            // Si es largo, buscamos contexto
            if (this.containsWord(normalized, this.TRANSPORT_CONTEXT)) {
                return SentimentType.POSITIVE;
            }
        }

        // 4. Por defecto, si no entendemos la intención
        return SentimentType.NEUTRAL;
    }

    /**
     * Analiza el sentimiento con información de confianza
     * @returns Objeto con el resultado detallado
     */
    public static AnalyzeWithConfidence(msg: string): { sentiment: SentimentType; confidence: number } {
        const sentiment = this.ValidateSentiment(msg);
        let confidence = 0.5;

        const normalized = this.normalizeText(msg);

        switch (sentiment) {
            case SentimentType.POSITIVE:
                if (this.containsPhrase(normalized, this.STRONG_POSITIVE_PHRASES)) confidence = 0.95;
                else if (this.containsWord(normalized, this.ACTION_VERBS)) confidence = 0.85;
                else confidence = 0.7;
                break;
            case SentimentType.NEGATIVE:
                if (this.containsPhrase(normalized, this.STRONG_NEGATIVE_PHRASES)) confidence = 0.95;
                else confidence = 0.8;
                break;
            case SentimentType.NEUTRAL:
                if (this.containsPhrase(normalized, this.DOUBT_WORDS)) confidence = 0.9; // Alta confianza de que es duda
                else confidence = 0.2; // Baja confianza, simplemente no entendimos
                break;
        }

        return { sentiment, confidence };
    }

    /**
     * Normaliza el texto eliminando caracteres especiales y espacios extras
     */
    private static normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
            .replace(/[¿?¡!.,;:]/g, ' ')  // Reemplazar puntuación por espacios
            .replace(/\s+/g, ' ')          // Normalizar espacios múltiples
            .trim();
    }

    /**
     * Verifica si el texto contiene alguna de las frases exactas
     */
    private static containsPhrase(text: string, phrases: readonly string[]): boolean {
        return phrases.some(phrase => {
            const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Coincidir frase completa respetando límites de palabras
            return new RegExp(`(^|\\s)${escaped}($|\\s)`, 'i').test(text);
        });
    }

    /**
     * Verifica si el texto contiene alguna de las palabras (búsqueda exacta de palabra)
     */
    private static containsWord(text: string, words: readonly string[]): boolean {
        return words.some(word => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
        });
    }
}