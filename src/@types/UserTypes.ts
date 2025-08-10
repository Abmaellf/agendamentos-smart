export interface UserType{
    token: string;
    user: {
        id: string
		login: string,
		password: string,
		role: string,
    }
}