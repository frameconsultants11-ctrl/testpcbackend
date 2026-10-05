import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegistrationsClient from "@/components/admin/RegistrationsClient";

export default async function EventRegistrationsPage({
  params,
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  return <RegistrationsClient eventId={id} />;
}