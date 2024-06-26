import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Headers,
  HttpStatus,
  HttpException,
  Param
} from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '../../prisma/generated/client';
import { UserResponseDTO } from 'src/DTO/UserResponseDTO';
import { UpdateUserDTO } from 'src/DTO/UpdateUserDTO';
import { UpdateUserStatusDTO } from 'src/DTO/UpdateUserStatusDTO';

const bcrypt = require('bcrypt');

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getUserById(@Headers() headers: any): Promise<UserResponseDTO> {
    const id = headers['authorization'].id;
    const user: UserModel = await this.userService.getUserById({ id: id });

    if (!user) throw new HttpException('Resource Not Found', HttpStatus.NOT_FOUND);

    const response: UserResponseDTO = {
      name: user.name,
      email: user.email,
      picture: user.picture
    }

    return response;
  }

  @Get('page/:page')
  async getAllUser(
    @Param('page') page: number,
    @Headers() headers: any
  ): Promise<UserResponseDTO[]> {
    const rol = headers['authorization'].rol;
    if (rol !== 'admin') throw new HttpException('Unauthorized Access', HttpStatus.UNAUTHORIZED);
    const response = this.userService.getAllUser({
      skip: page * 10,
      take: 10,
      where: { rol: 'user' }
    });

    return (await response).map((user) => {      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
        state: user.state
      }
    })

  }

  @Put()
  async updateUser(@Headers() headers: any, @Body() data: UpdateUserDTO): Promise<UserResponseDTO> {
    const id = headers['authorization'].id;

    const user: UserModel = await this.userService.updateUser({ id: id }, data);

    if (!user) throw new HttpException('Resource Not Found', HttpStatus.NOT_FOUND);

    const response: UserResponseDTO = {
      name: user.name,
      email: user.email,
      username: user.username,
      picture: user.picture
    }

    return response;
  }

  @Delete()
  async deleteUser(@Headers() headers: any): Promise<UserResponseDTO> {
    const id = headers['authorization'].id;

    const user: UserModel = await this.userService.deleteUser({ id: id });

    if (!user) throw new HttpException('Resource Not Found', HttpStatus.NOT_FOUND);

    const response: UserResponseDTO = {
      name: user.name,
      email: user.email,
      username: user.username,
      picture: user.picture,
    }

    return response; 
  }

  @Put('/state')
  async updateUserStatus(@Headers() headers: any, @Body() data: UpdateUserStatusDTO): Promise<UserResponseDTO> {
    const rol = headers['authorization'].rol;
    if (rol !== 'admin') throw new HttpException('Unauthorized Access', HttpStatus.UNAUTHORIZED);
    const { id, state } = data;
    console.log(data)
    console.log(id, state)
    const response = await this.userService.updateUser({ id: id }, { state: state  });

    if (!response) throw new HttpException('Resource Not Found', HttpStatus.NOT_FOUND);

    return {
      id: response.id,
      name: response.name,
      username: response.username,
      email: response.email,
      picture: response.picture,
      state: response.state
    };
  }

}
