import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeadDetailComposeEmail } from "./lead-detail-compose-email";
import { LeadEnrichmentTable } from "./lead-enrichment-table";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

const sampleLead = {
  id: "lead-1",
  grade: "A",
  score: 85,
  status: "new",
  company: "Sample Studio",
  country: "Japan",
  game: "Test Quest",
  platform: "PC",
  stage: "pre launch",
  packages: "Pre-Launch QA Package",
  source: "Sample RSS",
  enrichmentStatus: "completed",
  enrichmentConfidence: 100,
  website: "https://samplestudio.example.com",
  email: "jiraldcalusay@gmail.com"
};

function selectFiles(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>("input[type='file']");
  expect(input).toBeTruthy();

  fireEvent.change(input as HTMLInputElement, {
    target: {
      files: [
        new File(["one"], "first.pdf", { type: "application/pdf" }),
        new File(["two"], "second.pdf", { type: "application/pdf" })
      ]
    }
  });
}

describe("email attachment selection", () => {
  it("shows multiple selected files in the lead list compose modal", () => {
    const { container } = render(<LeadEnrichmentTable emailBodyTemplate="Hi [company_name]" leads={[sampleLead]} />);

    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: /compose email/i }));
    selectFiles(container);

    expect(screen.getByText("first.pdf")).toBeInTheDocument();
    expect(screen.getByText("second.pdf")).toBeInTheDocument();
  });

  it("shows selected files in the lead detail compose modal", () => {
    const { container } = render(
      <LeadDetailComposeEmail
        leadId="lead-1"
        companyName="Sample Studio"
        email="jiraldcalusay@gmail.com"
        emailBodyTemplate="Hi [company_name]"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /compose email/i }));
    selectFiles(container);

    expect(screen.getByText("first.pdf")).toBeInTheDocument();
    expect(screen.getByText("second.pdf")).toBeInTheDocument();
  });
});
