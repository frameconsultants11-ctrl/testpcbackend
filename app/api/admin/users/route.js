import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";

    const page = Math.max(
      parseInt(searchParams.get("page") || "1", 10),
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(searchParams.get("limit") || "20", 10),
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const db = await getDB();

    const query = {
      role: { $ne: "admin" },
    };

    // Search
    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          mobile: {
            $regex: search,
            $options: "i",
          },
        },
        {
          referralCode: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Status
    if (status === "active") {
      query.isActive = true;
    }

    if (status === "inactive") {
      query.isActive = false;
    }

    const usersCollection = db.collection("members");

    const [users, total] = await Promise.all([
      usersCollection
        .find(query)
        .project({
          password: 0,
          failedLoginAttempts: 0,
          lockedUntil: 0,
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray(),

      usersCollection.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,

      users: users.map((user) => ({
        ...user,
        _id: user._id.toString(),
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "ADMIN USERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}