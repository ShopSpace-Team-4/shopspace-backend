import { Model, FilterQuery, UpdateQuery, Types } from 'mongoose';

// Generic CRUD wrapper so services never call `mongoose` methods directly.
// Every entity-specific repository (UserRepository, etc.) extends this.
export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findById(id: string | Types.ObjectId, withSelect?: string): Promise<T | null> {
    const query = this.model.findById(id);
    if (withSelect) query.select(withSelect);
    return query.exec();
  }

  async findOne(filter: FilterQuery<T>, withSelect?: string): Promise<T | null> {
    const query = this.model.findOne(filter);
    if (withSelect) query.select(withSelect);
    return query.exec();
  }

  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async updateById(id: string | Types.ObjectId, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteById(id: string | Types.ObjectId): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
