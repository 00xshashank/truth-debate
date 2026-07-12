from Bio import Entrez
import xml.etree.ElementTree as ET
import time
import traceback

Entrez.email = "john.doe@example.com"
Entrez.tool = "PMCFullTextDownloader"


def search_pmc(query: str, max_results: int = 3):
    """
    Search PubMed Central directly for open-access full text papers.
    """

    handle = Entrez.esearch(
        db="pmc",
        term=query,
        retmax=max_results,
        sort="relevance"
    )

    results = Entrez.read(handle)
    handle.close()

    return results["IdList"]


def fetch_pmc_xml(pmc_id: str):
    """
    Download article XML from PMC.
    """

    handle = Entrez.efetch(
        db="pmc",
        id=pmc_id,
        rettype="full",
        retmode="xml"
    )

    xml_text = handle.read()
    handle.close()

    return xml_text


def extract_title(root):
    """
    Extract article title.
    """

    title_elem = root.find(".//article-title")

    if title_elem is None:
        return ""

    return "".join(title_elem.itertext()).strip()


def extract_abstract(root):
    """
    Extract abstract text.
    """

    abstract_parts = []

    for p in root.findall(".//abstract//p"):
        text = "".join(p.itertext()).strip()

        if text:
            abstract_parts.append(text)

    return "\n\n".join(abstract_parts)


def extract_full_text(root):
    """
    Extract all paragraph text from article body.
    """

    body = root.find(".//body")

    if body is None:
        return ""

    paragraphs = []

    for p in body.iter("p"):
        text = "".join(p.itertext()).strip()

        if text:
            paragraphs.append(text)

    return "\n\n".join(paragraphs)


def get_open_access_papers(
    query: str,
    max_chars: int = 10000
):
    """
    Retrieve full-text PMC papers.
    """

    max_results: int = 5

    pmc_ids = search_pmc(query, max_results)

    print(f"Found {len(pmc_ids)} PMC papers")

    papers = []

    for pmc_id in pmc_ids:

        print(f"\nFetching PMC{pmc_id}")

        try:

            xml_text = fetch_pmc_xml(pmc_id)

            root = ET.fromstring(xml_text)

            title = extract_title(root)
            abstract = extract_abstract(root)
            full_text = extract_full_text(root)

            if len(full_text) == 0:
                continue

            papers.append(
                {
                    "pmcid": f"PMC{pmc_id}",
                    "title": title,
                    "abstract": abstract,
                    "full_text": full_text[:max_chars]
                }
            )

            print(
                f"Success | "
                f"title={title[:60]}... | "
                f"text_len={len(full_text)}"
            )

        except Exception:

            print(f"Failed PMC{pmc_id}")
            traceback.print_exc()

        time.sleep(0.34)

    return papers


if __name__ == "__main__":

    papers = get_open_access_papers(
        query="CRISPR Gene Editing",
        max_results=5
    )

    print("\n")
    print("=" * 80)
    print(f"Retrieved {len(papers)} papers")
    print("=" * 80)

    for paper in papers:

        print("\n")
        print("=" * 80)
        print("TITLE:", paper["title"])
        print("PMCID:", paper["pmcid"])
        print("TEXT LENGTH:", len(paper["full_text"]))

        print("\nFULL TEXT SAMPLE:\n")
        print(paper["full_text"][:500])