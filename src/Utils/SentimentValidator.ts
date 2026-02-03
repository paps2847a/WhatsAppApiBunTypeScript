export default class SentimentValidator {
    // Palabras clave ordenadas por especificidad (más específicas primero)
    private static readonly NEGATIVE_KEYWORDS = [
        'no usare', 'no voy', 'no necesito', 'no ocupo', 'no requiero',
        'no puedo', 'no ire', 'no lo usare', 'no lo necesito',
        'hoy no', 'no confirmo', 'negativo', 'cancelo', 'no gracias'
    ];
    
    private static readonly POSITIVE_KEYWORDS = [
        'si usare', 'si voy', 'si necesito', 'si ocupo', 'si requiero',
        'usare', 'voy', 'necesito', 'ocupo', 'requiero', 'ire',
        'claro', 'confirmo', 'afirmativo', 'si', 'ok', 'vale',
        'por favor', 'si lo usare', 'lo necesito'
    ];

    // Patrones de negación que invalidan palabras positivas
    private static readonly NEGATION_PATTERNS = [
        /\bno\s+\w+/gi,           // "no [palabra]"
        /\bnunca\b/gi,            // "nunca"
        /\btampoco\b/gi,          // "tampoco"
        /\bni\b/gi,               // "ni"
        /\bjamas\b/gi,            // "jamás"
        /\bsin\b/gi               // "sin"
    ];

    // Palabras de contexto que refuerzan la intención
    private static readonly TRANSPORT_CONTEXT = [
        'transporte', 'viaje', 'ruta', 'bus', 'carro', 'vehiculo',
        'llevar', 'recoger', 'pasar', 'servicio', 'turno'
    ];

    /**
     * Valida la intención de uso del servicio de transporte
     * @param msg Mensaje del usuario
     * @returns true si desea usar el servicio, false en caso contrario
     */
    public static ValidateSentiment(msg: string): boolean {
        if (!msg?.trim()) return false;

        const normalized = this.normalizeText(msg);
        
        // 1. Detectar negaciones fuertes (máxima prioridad)
        if (this.hasStrongNegation(normalized)) {
            return false;
        }

        // 2. Buscar palabras clave negativas específicas
        if (this.containsKeywords(normalized, this.NEGATIVE_KEYWORDS)) {
            return false;
        }

        // 3. Buscar palabras clave positivas
        const hasPositive = this.containsKeywords(normalized, this.POSITIVE_KEYWORDS);
        
        // 4. Verificar contexto de transporte para mayor precisión
        const hasContext = this.hasTransportContext(normalized);
        
        // Si tiene palabras positivas y contexto, es más confiable
        return hasPositive || (hasContext && !this.hasAmbiguity(normalized));
    }

    /**
     * Normaliza el texto eliminando caracteres especiales y espacios extras
     */
    private static normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[¿?¡!.,;:]/g, ' ')  // Reemplazar puntuación por espacios
            .replace(/\s+/g, ' ')          // Normalizar espacios múltiples
            .trim();
    }

    /**
     * Detecta patrones de negación fuertes en el texto
     */
    private static hasStrongNegation(text: string): boolean {
        return this.NEGATION_PATTERNS.some(pattern => pattern.test(text));
    }

    /**
     * Verifica si el texto contiene alguna palabra clave de la lista
     * Usa búsqueda optimizada con límites de palabra
     */
    private static containsKeywords(text: string, keywords: readonly string[]): boolean {
        // Optimización: buscar primero palabras cortas que son más comunes
        for (const keyword of keywords) {
            // Usar límites de palabra para evitar falsos positivos
            // Ej: "usare" no debe coincidir con "causare"
            const pattern = keyword.includes(' ') 
                ? keyword  // Frases completas
                : `\\b${keyword}\\b`;  // Palabras individuales con límites
            
            if (new RegExp(pattern, 'i').test(text)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica si el mensaje tiene contexto relacionado con transporte
     */
    private static hasTransportContext(text: string): boolean {
        return this.TRANSPORT_CONTEXT.some(word => text.includes(word));
    }

    /**
     * Detecta ambigüedad en el mensaje (preguntas, dudas)
     */
    private static hasAmbiguity(text: string): boolean {
        const ambiguousPatterns = [
            /\btal vez\b/i,
            /\bquizas\b/i,
            /\bno se\b/i,
            /\bdudo\b/i,
            /\bpuede ser\b/i
        ];
        return ambiguousPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Analiza el sentimiento con información de confianza
     * @returns Objeto con el resultado y nivel de confianza
     */
    public static AnalyzeWithConfidence(msg: string): { willUse: boolean; confidence: number } {
        if (!msg?.trim()) return { willUse: false, confidence: 0 };

        const normalized = this.normalizeText(msg);
        let confidence = 0;

        // Calcular confianza basada en múltiples factores
        const hasNegative = this.containsKeywords(normalized, this.NEGATIVE_KEYWORDS);
        const hasPositive = this.containsKeywords(normalized, this.POSITIVE_KEYWORDS);
        const hasContext = this.hasTransportContext(normalized);
        const hasAmbiguity = this.hasAmbiguity(normalized);

        if (hasNegative) {
            confidence = 0.9; // Alta confianza en negación
            return { willUse: false, confidence };
        }

        if (hasPositive) {
            confidence = hasContext ? 0.95 : 0.75; // Mayor confianza con contexto
            return { willUse: true, confidence };
        }

        if (hasContext && !hasAmbiguity) {
            confidence = 0.6; // Confianza media solo con contexto
            return { willUse: true, confidence };
        }

        return { willUse: false, confidence: 0.3 }; // Baja confianza
    }
}