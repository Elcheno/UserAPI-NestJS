import { Injectable } from '@nestjs/common';
import { Prisma, User } from '../../prisma/generated/client';
import { UserService } from 'src/user/user.service';
import { CreateUserDTO } from 'src/DTO/CreateUserDTO';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

@Injectable()
export class AuthService {

  constructor(
    private userService: UserService
  ) { }

  async login(email: Prisma.UserWhereUniqueInput, password: string): Promise<any | null> {
    const user: User = await this.userService.getUserByEmail(email);

    const passwordCorrect: boolean = user === null
      ? false
      : await bcrypt.compare(password, user.password);

    if (!(user && passwordCorrect)) return null;

    const expPlus = Number(process.env.EXP);
    let expToken = null;

    if (expPlus) expToken = Math.round(Date.now() / 1000 + expPlus);

    const userForToken = {
      id: user.id,
      name: user.name,
      email: user.email,
      rol: user.rol,
      state: user.state,
      exp: expToken
    }

    const token = jwt.sign(userForToken, process.env.SECRET);

    return {
      username: user.username,
      email: user.email,
      name: user.name,
      picture: user.picture,
      rol: user.rol,
      state: user.state,
      token: token
    };
  }

  async register(data: CreateUserDTO): Promise<any | null> {
    try {
      const id = crypto.randomUUID();

      let { password, ...userWithoudPassw } = data;

      const salt = await bcrypt.genSaltSync(10);
      password = bcrypt.hashSync(password, salt);

      if (password) {
        const user = await this.userService.createUser({ id, password, ...userWithoudPassw });

        if (!user) return null;

        const response = await this.login({ email: data.email }, data.password);

        return response;

      } else {
        return null;

      }

    } catch {
      return null;

    }
  }

  async checkToken(token: string): Promise<any | null> {
    let decodedToken = null;

    try {
      decodedToken = jwt.verify(token, process.env.SECRET);

    } catch (e) {
      return null;

    }

    if (!decodedToken.id) return null;

    const user = await this.userService.getUserById({ id: decodedToken.id });

    if (!user) {
      return {
        decodedToken: null,
        user: null
      };
    }

    return {
      decodedToken,
      user
    };
  }
}
