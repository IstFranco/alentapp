export class Sport {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly max_capacity: number,
        public readonly additional_price: number,
        public readonly requires_medical_certificate: boolean,
    ) {}
}
