import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";

export default function NotFoundPage() {
  return (
    <div>
      <PageHeader path="404" title="Not found" />
      <p className="text-mute">That route does not exist. <Link className="text-signal underline" to="/">Return to dashboard</Link></p>
    </div>
  );
}
