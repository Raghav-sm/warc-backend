import Login from "./login";
import Logout from "./logout";
import RefreshToken from "./refresh-token";
import SignUp from "./sign-up";

const AuthMutationFields = {
  login: Login,
  signUp: SignUp,
  refreshToken: RefreshToken,
  logout: Logout,
};

export default AuthMutationFields;
