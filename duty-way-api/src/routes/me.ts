import type { User } from '../types';
import {json} from "../utlis";

export function getMe(currentUser: User, corsHeaders: Record<string, string>): Response {
	return json(currentUser, corsHeaders);
}
