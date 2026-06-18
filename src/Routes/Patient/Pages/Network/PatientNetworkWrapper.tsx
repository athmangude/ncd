import RouteMetadata from "@/components/RouteMetadata"
import { Route, Routes } from "react-router-dom"
import PatientAddConnection from "./PatientAddConnection"
import PatientMyNetworkPage from "./PatientMyNetwork"
import PatientAcceptInvite from "./PatientAcceptInvite"
import PatientAcceptShareLink from "./PatientAcceptShareLink"
import { PatientInviteExpired } from "./PatientInviteExpired"
import PatientInviteAccepted from "./PatientInviteAccepted"
import PatientInviteRejected from "./PatientInviteRejected"
import PatientInvitationsSent from "./PatientInvitationsSent"
import PatientInvitationsReceived from "./PatientInvitationsReceived"
import InviteTextPage from "./InviteTextPage"
import InviteVoicePage from "./InviteVoicePage"
import CheckProfilePhotoPage from "./CheckProfilePhotoPage"
import PreviewInvitePage from "./PreviewInvitePage"
import AddCircleMemberPage from "./AddCircleMemberPage"
import InviteMethodPage from "./InviteMethodPage"
import InviteMethodInfoPage from "./InviteMethodInfoPage"
import PatientCircleMemberDetails from "./PatientCircleMemberDetails"
import PatientInviteRejectedView from "./PatientInviteRejectedView"

export default function PatientNetworkWrapper() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteMetadata title="My Network">
            <PatientMyNetworkPage />
          </RouteMetadata>
        }
      />
      
      <Route
        path="/invite-text"
        element={
          <RouteMetadata title="Invite Text">
            <InviteTextPage />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-voice"
        element={
          <RouteMetadata title="Invite Voice">
            <InviteVoicePage />
          </RouteMetadata>
        }
      />

      <Route
        path="/check-profile-photo"
        element={
          <RouteMetadata title="Verify Profile">
            <CheckProfilePhotoPage />
          </RouteMetadata>
        }
      />

      <Route
        path="/preview-invite"
        element={
          <RouteMetadata title="Preview Invite">
            <PreviewInvitePage />
          </RouteMetadata>
        }
      />

      <Route
        path="/invitations-sent"
        element={
          <RouteMetadata title="Invitations Sent">
            <PatientInvitationsSent />
          </RouteMetadata>
        }
      />

      <Route
        path="/invitations-received"
        element={
          <RouteMetadata title="Invitations Received">
            <PatientInvitationsReceived />
          </RouteMetadata>
        }
      />

      <Route
        path="/add-connection"
        element={
          <RouteMetadata title="Add Connection">
            <PatientAddConnection />
          </RouteMetadata>
        }
      />

      <Route
        path="/add-circle-member"
        element={
          <RouteMetadata title="Add Circle Member">
            <AddCircleMemberPage />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-method"
        element={
          <RouteMetadata title="Invite Method">
            <InviteMethodPage />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-info"
        element={
          <RouteMetadata title="Invite Info">
            <InviteMethodInfoPage />
          </RouteMetadata>
        }
      />

      <Route
        path="/accept-invite"
        element={
          <RouteMetadata title="Accept Invite">
            <PatientAcceptInvite />
          </RouteMetadata>
        }
      />

      <Route
        path="/accept-share-link"
        element={
          <RouteMetadata title="Accept Share Link">
            <PatientAcceptShareLink />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-expired"
        element={
          <RouteMetadata title="Invite Expired">
            <PatientInviteExpired />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-accepted"
        element={
          <RouteMetadata title="Invite Accepted">
            <PatientInviteAccepted />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-rejected"
        element={
          <RouteMetadata title="Invite Rejected">
            <PatientInviteRejected />
          </RouteMetadata>
        }
      />

      <Route
        path="/invite-rejected/:inviteId"
        element={
          <RouteMetadata title="Invite Rejected">
            <PatientInviteRejectedView />
          </RouteMetadata>
        }
      />

      <Route
        path="/:targetId"
        element={
          <RouteMetadata title="Circle member details">
            <PatientCircleMemberDetails />
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
