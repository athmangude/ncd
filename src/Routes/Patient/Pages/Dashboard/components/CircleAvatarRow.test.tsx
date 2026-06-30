import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CircleAvatarRow } from "./CircleAvatarRow"
import type { NetworkMember } from "@/hooks/usePatientNetwork"

const jane: NetworkMember = {
  id: "j",
  firstName: "Jane",
  lastName: "Doe",
  phoneNumber: "+254700000000",
  status: "ACTIVE",
  profilePhoto: null,
  relationship: "PARENT",
  joinedAt: null,
  hasDefaultedLoan: false,
} as unknown as NetworkMember

const brian: NetworkMember = {
  ...jane,
  id: "b",
  firstName: "Brian",
}

const baseSlots = {
  accountable: { used: 1, reserved: 0, max: 3 },
  auxiliary: { used: 0, reserved: 0, max: 2 },
}

describe("CircleAvatarRow", () => {
  it("shows no locked avatars when user has no members or pending invites", () => {
    render(
      <CircleAvatarRow
        members={[]}
        pendingInvites={[]}
        slots={baseSlots}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    expect(screen.queryAllByTestId("lock-icon")).toHaveLength(0)
    expect(screen.getAllByTestId("empty-slot")).toHaveLength(3)
  })

  it("renders 1 confirmed + 2 empty + 2 locked when 1 accountable filled", () => {
    render(
      <CircleAvatarRow
        members={[jane]}
        pendingInvites={[]}
        slots={baseSlots}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    // 1 confirmed member + 2 locked auxiliary halos = 3 halo elements
    expect(screen.getAllByTestId("avatar-halo")).toHaveLength(3)
    expect(screen.getAllByTestId("empty-slot")).toHaveLength(2)
    expect(screen.getAllByTestId("lock-icon")).toHaveLength(2)
  })

  it("always uses pending (orange) variant for invite slots regardless of banner", () => {
    render(
      <CircleAvatarRow
        members={[jane]}
        pendingInvites={[
          {
            id: "i1",
            firstName: "Fred",
            lastName: "L",
            phoneNumber: "+1",
            status: "PENDING",
          } as never,
        ]}
        slots={{
          accountable: { used: 1, reserved: 1, max: 3 },
          auxiliary: { used: 0, reserved: 0, max: 2 },
        }}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    const dots = screen.getAllByTestId("avatar-dot")
    expect(dots.some((d) => d.classList.contains("bg-orange-500"))).toBe(true)
  })

  it("highlights only the recently joined member with the new variant", () => {
    render(
      <CircleAvatarRow
        members={[jane, brian]}
        pendingInvites={[]}
        slots={{
          accountable: { used: 2, reserved: 0, max: 3 },
          auxiliary: { used: 0, reserved: 0, max: 2 },
        }}
        activeBanner={{
          variant: "MEMBER_JOINED",
          member: {
            id: brian.id,
            firstName: brian.firstName,
            lastName: brian.lastName,
            avatarUrl: null,
          },
        }}
        recentJoinedMemberId={brian.id}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    const greenDots = screen
      .getAllByTestId("avatar-dot")
      .filter((d) => d.classList.contains("bg-green-500"))
    expect(greenDots).toHaveLength(1)
  })

  it("fades only the recently left member when banner is MEMBER_LEFT", () => {
    render(
      <CircleAvatarRow
        members={[jane]}
        pendingInvites={[]}
        slots={baseSlots}
        activeBanner={{
          variant: "MEMBER_LEFT",
          member: {
            id: jane.id,
            firstName: "Jane",
            lastName: "Doe",
            avatarUrl: null,
          },
          stillQualifies: true,
          eventId: "evt-1",
        }}
        recentJoinedMemberId={null}
        recentLeftMemberId={jane.id}
        onAddMember={() => {}}
      />
    )
    const fadedHalos = screen
      .getAllByTestId("avatar-halo")
      .filter((h) => h.classList.contains("opacity-40"))
    expect(fadedHalos).toHaveLength(1)
  })

  it("renders the current user as the first avatar when provided", () => {
    render(
      <CircleAvatarRow
        currentUser={{ firstName: "Sheila", lastName: "S", profilePhoto: null }}
        members={[jane]}
        pendingInvites={[]}
        slots={baseSlots}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    // current user + 1 confirmed + 2 locked auxiliary = 4 halos
    expect(screen.getAllByTestId("avatar-halo")).toHaveLength(4)
    // First stacked cell has no negative margin; subsequent cells overlap.
    const cells = screen.getAllByTestId("stacked-cell")
    expect(cells.length).toBeGreaterThanOrEqual(2)
    expect(cells[0].className).not.toContain("-ml-3")
    expect(cells[1].className).toContain("-ml-3")
  })

  it("renders adults (and their pending invites) before junior members", () => {
    const adultMember: NetworkMember = {
      ...jane,
      id: "adult-m",
      firstName: "Adult",
      relationship: "PARENT",
    } as unknown as NetworkMember
    const childMember: NetworkMember = {
      ...jane,
      id: "child-m",
      firstName: "Junior",
      relationship: "CHILD",
    } as unknown as NetworkMember
    const adultInvite = {
      id: "adult-i",
      firstName: "PendingAdult",
      lastName: "X",
      phoneNumber: "+1",
      status: "PENDING",
      relationship: "SIBLING",
    } as never
    const childInvite = {
      id: "child-i",
      firstName: "PendingChild",
      lastName: "Y",
      phoneNumber: "+2",
      status: "PENDING",
      relationship: "CHILD",
    } as never

    render(
      <CircleAvatarRow
        members={[childMember, adultMember]}
        pendingInvites={[childInvite, adultInvite]}
        slots={{
          accountable: { used: 2, reserved: 1, max: 3 },
          auxiliary: { used: 1, reserved: 1, max: 2 },
        }}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )

    const cells = screen.getAllByTestId("stacked-cell")
    // Adults (member + invite) come before juniors (member + invite). The
    // empty/locked tail follows. We assert by reading first names off the
    // ProfileAvatar fallbacks which render initials with aria-label.
    const firstCellText = cells[0].textContent ?? ""
    const secondCellText = cells[1].textContent ?? ""
    const thirdCellText = cells[2].textContent ?? ""
    const fourthCellText = cells[3].textContent ?? ""
    expect(firstCellText).toContain("AD") // Adult Doe (adult member)
    expect(secondCellText).toContain("PX") // PendingAdult X (adult invite)
    expect(thirdCellText).toContain("JD") // Junior Doe (child member)
    expect(fourthCellText).toContain("PY") // PendingChild Y (child invite)
  })

  it("buckets an AUXILIARY-relationship member as junior, matching the slot domain", () => {
    const adultMember: NetworkMember = {
      ...jane,
      id: "adult-m",
      firstName: "Adult",
      relationship: "PARENT",
    } as unknown as NetworkMember
    // The slot domain treats both CHILD and AUXILIARY as juniors; the avatar
    // row previously only recognised CHILD, so an AUXILIARY member showed in the
    // adult row while the slot counts placed it in auxiliary.
    const auxMember: NetworkMember = {
      ...jane,
      id: "aux-m",
      firstName: "Junior",
      relationship: "AUXILIARY",
    } as unknown as NetworkMember

    render(
      <CircleAvatarRow
        members={[auxMember, adultMember]}
        pendingInvites={[]}
        slots={{
          accountable: { used: 1, reserved: 0, max: 3 },
          auxiliary: { used: 1, reserved: 0, max: 2 },
        }}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )

    const cells = screen.getAllByTestId("stacked-cell")
    // Adult first, the AUXILIARY member after it (not interleaved as an adult).
    expect(cells[0].textContent ?? "").toContain("AD") // Adult Doe
    expect(cells[1].textContent ?? "").toContain("JD") // Junior Doe (auxiliary)
  })

  it("shows orange ring for a member with PENDING status", () => {
    const pendingMember: NetworkMember = {
      ...jane,
      id: "p",
      firstName: "Pending",
      status: "PENDING",
    } as unknown as NetworkMember
    render(
      <CircleAvatarRow
        members={[pendingMember]}
        pendingInvites={[]}
        slots={baseSlots}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    const dots = screen.getAllByTestId("avatar-dot")
    expect(dots.some((d) => d.classList.contains("bg-orange-500"))).toBe(true)
  })

  it("shows no locked avatars when 2 adults + 4 juniors fill all auxiliary slots", () => {
    const junior = (id: string, n: string): NetworkMember =>
      ({
        ...jane,
        id,
        firstName: n,
        relationship: "CHILD",
      }) as unknown as NetworkMember

    render(
      <CircleAvatarRow
        members={[
          jane,
          { ...jane, id: "a2", firstName: "Bob" } as unknown as NetworkMember,
          junior("c1", "C1"),
          junior("c2", "C2"),
          junior("c3", "C3"),
          junior("c4", "C4"),
        ]}
        pendingInvites={[]}
        slots={{
          accountable: { used: 2, reserved: 0, max: 3 },
          auxiliary: { used: 4, reserved: 0, max: 4 },
        }}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={() => {}}
      />
    )
    expect(screen.queryAllByTestId("lock-icon")).toHaveLength(0)
    // 1 accountable slot remains (adults=2, max=3)
    expect(screen.getAllByTestId("empty-slot")).toHaveLength(1)
  })

  it("fires onAddMember when an empty + slot is clicked", () => {
    const onAddMember = vi.fn()
    render(
      <CircleAvatarRow
        members={[jane]}
        pendingInvites={[]}
        slots={baseSlots}
        activeBanner={null}
        recentJoinedMemberId={null}
        recentLeftMemberId={null}
        onAddMember={onAddMember}
      />
    )
    fireEvent.click(screen.getAllByTestId("empty-slot")[0])
    expect(onAddMember).toHaveBeenCalledTimes(1)
  })
})
