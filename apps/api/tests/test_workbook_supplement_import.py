from pathlib import Path

from scripts.import_supplement_stack_xls import load_workbook_supplement_catalog


def test_workbook_supplement_import_extracts_clean_catalog():
    workbook_path = Path(__file__).resolve().parents[3] / "data" / "Supplement_Stack.xls"

    items = load_workbook_supplement_catalog(
        workbook_path=workbook_path,
        excluded_names={"Spermidine"},
    )

    names = {item["name"] for item in items}
    by_name = {item["name"]: item for item in items}

    assert "Spermidine" not in names
    assert "Collagen Peptides" in names
    assert "Magnesium Taureate" in names
    assert "Rhodiola Rosea" in names
    assert "Metformin" not in names
    assert "Bioidentical testosterone cream/pellets" not in names
    assert by_name["Collagen Peptides"]["category"] == "musculoskeletal"
    assert by_name["Magnesium Taureate"]["category"] == "sleep_recovery"
