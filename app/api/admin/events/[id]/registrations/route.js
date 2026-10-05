import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "ALL";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 20,
        1
      ),
      100
    );

    const eventId = new ObjectId(id);

    const db = await getDB();

    /*
     * ==========================================
     * GET EVENT
     * ==========================================
     */

    const event =
      await db.collection("events").findOne({
        _id: eventId,
      });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ==========================================
     * REGISTRATION FILTER
     * ==========================================
     */

    const match = {
      eventId,
    };

    if (status !== "ALL") {
      match.status = status;
    }

    /*
     * ==========================================
     * AGGREGATION
     * ==========================================
     */

    const pipeline = [
      {
        $match: match,
      },

      /*
       * Get member
       */
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },

      {
        $unwind: {
          path: "$member",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    /*
     * ==========================================
     * SEARCH
     * ==========================================
     *
     * Search member OR guest OR QR.
     */

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            /*
             * Member
             */
            {
              "member.name": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "member.email": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "member.mobile": {
                $regex: search,
                $options: "i",
              },
            },

            /*
             * Member QR
             */
            {
              qrCode: {
                $regex: search,
                $options: "i",
              },
            },

            /*
             * Guest
             */
            {
              "guest.name": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "guest.mobile": {
                $regex: search,
                $options: "i",
              },
            },

            /*
             * Guest pass code
             */
            {
              "guestPassCode": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    /*
     * ==========================================
     * TOTAL COUNT
     * ==========================================
     */

    const countPipeline = [
      ...pipeline,
      {
        $count: "total",
      },
    ];

    const countResult =
      await db
        .collection("event_registrations")
        .aggregate(countPipeline)
        .toArray();

    const total =
      countResult[0]?.total || 0;

    /*
     * ==========================================
     * REGISTRATIONS
     * ==========================================
     */

    const registrations =
      await db
        .collection("event_registrations")
        .aggregate([
          ...pipeline,

          {
            $sort: {
              registeredAt: -1,
            },
          },

          {
            $skip:
              (page - 1) * limit,
          },

          {
            $limit: limit,
          },

          {
            $project: {
              _id: 1,

              eventId: 1,

              memberId: 1,

              status: 1,

              qrCode: 1,

              registeredAt: 1,

              attendedAt: 1,

              /*
               * Guest information
               */
              guest: 1,

              member: {
                _id: "$member._id",
                name: "$member.name",
                email: "$member.email",
                mobile: "$member.mobile",
                referralCode:
                  "$member.referralCode",
              },
            },
          },
        ])
        .toArray();

    /*
     * ==========================================
     * FORMAT RESPONSE
     * ==========================================
     */

    const formattedRegistrations =
      registrations.map(
        (registration) => {
          const hasGuest =
            registration.guest?.enabled === true;

          return {
            _id:
              registration._id.toString(),

            eventId:
              registration.eventId.toString(),

            memberId:
              registration.memberId.toString(),

            status:
              registration.status,

            qrCode:
              registration.qrCode,

            registeredAt:
              registration.registeredAt,

            attendedAt:
              registration.attendedAt,

            /*
             * Member
             */
            member:
              registration.member
                ? {
                    _id:
                      registration.member._id?.toString(),

                    name:
                      registration.member.name ||
                      "",

                    email:
                      registration.member.email ||
                      "",

                    mobile:
                      registration.member.mobile ||
                      "",

                    referralCode:
                      registration.member
                        .referralCode ||
                      "",
                  }
                : null,

            /*
             * Guest
             */
            guest: hasGuest
              ? {
                  enabled: true,

                  guestPassId:
                    registration.guest
                      .guestPassId
                      ?.toString() ||
                    null,

                  name:
                    registration.guest
                      .name || "",

                  mobile:
                    registration.guest
                      .mobile || "",

                  status:
                    registration.guest
                      .status || "RESERVED",
                }
              : {
                  enabled: false,

                  guestPassId: null,

                  name: "",

                  mobile: "",

                  status: null,
                },

            /*
             * Easy frontend value
             */
            hasGuest,
          };
        }
      );

    /*
     * ==========================================
     * EVENT COUNTS
     * ==========================================
     */

    const memberRegistrations =
      await db
        .collection("event_registrations")
        .countDocuments({
          eventId,

          status: {
            $in: [
              "REGISTERED",
              "ATTENDED",
            ],
          },
        });

    const guestReservations =
      await db
        .collection("event_registrations")
        .countDocuments({
          eventId,

          status: {
            $in: [
              "REGISTERED",
              "ATTENDED",
            ],
          },

          "guest.enabled": true,

          "guest.status": {
            $in: [
              "RESERVED",
              "ATTENDED",
            ],
          },
        });

    const registeredCount =
      memberRegistrations +
      guestReservations;

    const capacity =
      Number(event.capacity || 0);

    const availableCount =
      Math.max(
        capacity - registeredCount,
        0
      );

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

    return NextResponse.json({
      success: true,

      event: {
        _id:
          event._id.toString(),

        name:
          event.name,

        date:
          event.date,

        startTime:
          event.startTime,

        endTime:
          event.endTime,

        location:
          event.location,

        capacity,

        memberRegistrations,

        guestReservations,

        registeredCount,

        availableCount,
      },

      registrations:
        formattedRegistrations,

      pagination: {
        page,

        limit,

        total,

        totalPages:
          Math.ceil(
            total / limit
          ) || 1,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN EVENT REGISTRATIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch registrations.",
      },
      { status: 500 }
    );
  }
}