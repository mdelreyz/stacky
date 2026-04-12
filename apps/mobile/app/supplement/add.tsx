import { ScrollView } from "react-native";

import { SupplementAddHero } from "@/components/supplement-add/SupplementAddHero";
import { SupplementCatalogSection } from "@/components/supplement-add/SupplementCatalogSection";
import { SupplementFeaturesCard } from "@/components/supplement-add/SupplementFeaturesCard";
import { SupplementSearchSection } from "@/components/supplement-add/SupplementSearchSection";
import { SupplementSuggestionsSection } from "@/components/supplement-add/SupplementSuggestionsSection";
import { styles } from "@/components/supplement-add/styles";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { useSupplementAddScreen } from "@/lib/useSupplementAddScreen";

export default function AddSupplementScreen() {
  const {
    activeCategory,
    browsePreview,
    catalog,
    catalogLoading,
    categories,
    exactMatch,
    handleOnboard,
    loading,
    name,
    setActiveCategory,
    setName,
    suggestions,
    suggestionsLoading,
    trimmedName,
  } = useSupplementAddScreen();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <SupplementAddHero />
        <SupplementSearchSection
          catalogCount={catalog.length}
          catalogLoading={catalogLoading}
          exactMatch={exactMatch}
          name={name}
          onChangeName={setName}
          onClearName={() => setName("")}
          trimmedName={trimmedName}
        />
        <SupplementSuggestionsSection
          exactMatch={exactMatch}
          loading={loading}
          onSubmit={handleOnboard}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          trimmedName={trimmedName}
        />
        <SupplementCatalogSection
          activeCategory={activeCategory}
          browsePreview={browsePreview}
          catalogLoading={catalogLoading}
          categories={categories}
          onToggleCategory={(category) =>
            setActiveCategory((current) => (current === category ? null : category))
          }
        />
        <SupplementFeaturesCard />
      </FadeInView>
    </ScrollView>
  );
}
