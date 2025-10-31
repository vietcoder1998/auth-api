import { BaseRouter } from './index';
import { TokenDro, TokenDto, TokenModel } from '../interfaces';
import { TokenController, tokenController } from '../controllers/token.controller';

export class TokenRouter extends BaseRouter<TokenModel, TokenDto, TokenDro> {
	constructor(path: string, tokenController: TokenController) {
		super(path, tokenController);
		this.routes.post('/revoke', tokenController.revokeToken);
		this.routes.post('/grant', tokenController.grantToken);
	}
}

export const router = new TokenRouter('/tokens', tokenController).routes;
