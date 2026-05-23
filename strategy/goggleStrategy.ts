import passport from "passport";
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import { Request } from "express";
import User, { USER } from "../models/User";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      passReqToCallback: true,
    },
    async (
      _req: Request,
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: VerifyCallback
    ) => {
      try {
        const { emails, displayName, photos } = profile;

        const email = emails?.[0]?.value;
        const avatar = photos?.[0]?.value;


        if (!email) {
          return done(new Error("Google account has no email"), false);
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
          // Update profile picture if missing
          if (!user.profilePicture && avatar) {
            user.profilePicture = avatar;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          name: displayName,
          email,
          profilePicture: avatar,
          isVerified: true,
          agreeTerms: true,
        });

        return done(null, newUser);
      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err as Error, false);
      }
    }
  )
);

export default passport;
