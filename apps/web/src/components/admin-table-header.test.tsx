import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminTableHeader } from "./admin-table-header";

describe("AdminTableHeader", () => {
  it("renders a native table header with its column labels", () => {
    const html = renderToStaticMarkup(
      <table><AdminTableHeader><tr><th scope="col">Email</th></tr></AdminTableHeader></table>,
    );
    expect(html).toContain("<thead");
    expect(html).toContain('<th scope="col">Email</th>');
    expect(html).toContain("</thead>");
  });
});
