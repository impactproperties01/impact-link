import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  // Set expiration to 1 hour from now
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  // Reuse a valid link so a failed resend cannot invalidate an email already delivered.
  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email }
  });

  if (existingToken) {
    if (existingToken.expires > new Date()) return existingToken;
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: existingToken.token,
        }
      }
    });
  }

  // Create the new secure token in the database
  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    }
  });

  return verificationToken;
};
