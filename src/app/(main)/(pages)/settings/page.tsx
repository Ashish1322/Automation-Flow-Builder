import ProfileForm from "@/components/forms/profile-form";
import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type Props = {};

async function Settings({}: Props) {
  const authUser = await currentUser();
  if (!authUser) return null;

  console.log("Auth", authUser.id);

  const user = await db.user.findUnique({ where: { clerkId: authUser.id } });

  const updateUserInfo = async (name: string) => {
    "use server";

    const updateUser = await db.user.update({
      where: {
        clerkId: authUser.id,
      },
      data: {
        name,
      },
    });
    return updateUser;
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Settings</span>
      </h1>
      <div className="flex flex-col gap-10 p-6">
        <div>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or update your information
          </p>
        </div>

        <ProfileForm user={user} onUpdate={updateUserInfo}></ProfileForm>
      </div>
    </div>
  );
}

export default Settings;
