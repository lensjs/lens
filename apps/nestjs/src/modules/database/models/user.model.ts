import { Table, Column, Model } from 'sequelize-typescript';

@Table({
  tableName: 'test_models',
})
export class TestModel extends Model {
  @Column
  name: string;
}
