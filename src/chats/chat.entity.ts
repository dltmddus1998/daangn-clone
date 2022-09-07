import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
@ObjectType()
export class Chat extends BaseEntity {}
