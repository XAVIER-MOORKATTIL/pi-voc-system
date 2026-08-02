import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pivoc_secret_key_99';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    if (jwt_payload && jwt_payload.sub) {
      return done(null, jwt_payload);
    }
    return done(null, false);
  })
);

export const generateToken = (userId) => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
};

export const authenticateJWT = passport.authenticate('jwt', { session: false });