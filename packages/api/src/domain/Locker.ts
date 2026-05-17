export type LockerStatus = 'Available' | 'Occupied' | 'Maintenance';

export class Locker {
  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly location: string,
    public readonly status: LockerStatus,
    public readonly member_id: string | null
  ) {}
}
