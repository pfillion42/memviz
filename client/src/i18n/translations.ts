export type Language = 'en' | 'fr';

export const translations = {
  en: {
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_timeline: 'Timeline',
    nav_memories: 'Memories',
    nav_duplicates: 'Duplicates',
    nav_tags: 'Tags',
    nav_stale: 'Stale',
    nav_embeddings: 'Embeddings',
    nav_clusters: 'Clusters',
    nav_graph: 'Graph',

    // Common
    loading: 'Loading...',
    error_generic: 'Error',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    edit: 'Edit',
    type: 'Type',
    tags: 'Tags',

    // Dashboard
    dash_total_memories: 'Total memories',
    dash_distinct_types: 'Distinct types',
    dash_unique_tags: 'Unique tags',
    dash_total_accesses: 'Total accesses',
    dash_type_distribution: 'Distribution by type',
    dash_top_tags: 'Most used tags',
    dash_top_accessed: 'Most accessed memories',
    dash_usage_stats: 'Usage statistics',
    dash_period_day: 'Day',
    dash_period_week: 'Week',
    dash_period_month: 'Month',
    dash_import_export: 'Import / Export',
    dash_export_json: 'Export (JSON)',
    dash_import_json: 'Import (JSON)',
    dash_error_stats: 'Error loading statistics.',
    dash_error_export: 'Error during export.',
    dash_error_import: 'Error during import. Check the file format.',
    dash_import_result: 'Import complete: {imported} imported, {skipped} skipped.',
    dash_error_loading: 'Error loading.',

    // Timeline
    timeline_title: 'Timeline',
    timeline_empty: 'No memories in the timeline.',
    timeline_error: 'Error loading timeline.',
    timeline_count_one: '{count} memory',
    timeline_count_other: '{count} memories',

    // MemoryList
    ml_search_semantic: 'Semantic search...',
    ml_search_text: 'Search memories...',
    ml_mode_text: 'Text',
    ml_mode_vector: 'Vector',
    ml_aria_text_search: 'Text search',
    ml_aria_vector_search: 'Vector search',
    ml_col_content: 'Content',
    ml_col_quality: 'Quality',
    ml_col_score: 'Score',
    ml_col_date: 'Date',
    ml_no_results: 'No memory found.',
    ml_filter_count_one: '{count} active filter',
    ml_filter_count_other: '{count} active filters',
    ml_select_all: 'Select all',
    ml_error: 'Error loading memories.',

    // MemoryDetail
    md_back: '\u2190 Back to list',
    md_confirm_delete: 'Confirm deletion',
    md_aria_memory_type: 'Memory type',
    md_aria_memory_content: 'Memory content',
    md_tags_label: 'Tags (comma separated):',
    md_error_save: 'Error saving.',
    md_not_found: 'Memory not found or loading error.',
    md_created: 'Created',
    md_modified: 'Modified',
    md_hash: 'Hash',
    md_accesses: 'Accesses',
    md_associations: 'Associations',
    md_linked_hash: 'Linked hash',
    md_similarity: 'Similarity',

    // Duplicates
    dup_title: 'Duplicate detection',
    dup_threshold: 'Similarity threshold:',
    dup_none: 'No duplicates detected with this threshold.',
    dup_keep: 'Keep',
    dup_ignore: 'Ignore',
    dup_groups: '{count} groups',
    dup_error_delete: 'Error during deletion',

    // Tags
    tags_title: 'Tag management',
    tags_count: '{count} tags',
    tags_col_uses: 'Uses',
    tags_col_actions: 'Actions',
    tags_rename: 'Rename',
    tags_merge: 'Merge',
    tags_empty: 'No tags found.',
    tags_confirm_delete: 'Delete tag "{tag}"?',
    tags_merge_prompt: 'Target tag name:',

    // Stale
    stale_title: 'Stale memories',
    stale_count: '{count} stale memories',
    stale_age_label: 'Minimum age (days):',
    stale_days: '{days} d',
    stale_quality_label: 'Max quality:',
    stale_delete_all: 'Delete all',
    stale_empty: 'No stale memories found.',
    stale_confirm_delete: 'Delete {count} stale memories?',
    stale_quality: 'Quality:',

    // EmbeddingView
    emb_title: 'Vector space',
    emb_points: '{count} points',
    emb_neighbors: 'Neighbors (n_neighbors)',
    emb_aria_neighbors: 'Neighbors',
    emb_min_dist: 'Min distance (min_dist)',
    emb_aria_min_dist: 'Minimum distance',
    emb_empty: 'No points to display.',
    emb_error: 'Error loading projection.',

    // ClusterView
    cl_title: 'Semantic clusters',
    cl_count: '{count} clusters',
    cl_threshold: 'Threshold',
    cl_aria_threshold: 'Threshold',
    cl_min_size: 'Min size (min_size)',
    cl_aria_min_size: 'Minimum size',
    cl_memories: '{count} memories',
    cl_similarity: 'Similarity:',
    cl_empty: 'No clusters found with these parameters.',
    cl_error: 'Error loading clusters.',

    // GraphView
    graph_title: 'Association graph',
    graph_stats: '{nodes} nodes, {links} links',
    graph_empty: 'No associations found in the graph.',
    graph_error: 'Error loading graph.',

    // KeyboardHelp
    kb_title: 'Keyboard shortcuts',
    kb_next_line: 'Next line',
    kb_prev_line: 'Previous line',
    kb_focus_search: 'Focus search',
    kb_open_detail: 'Open detail',
    kb_close: 'Close / deselect',
    kb_show_help: 'Show this help',

    // BulkActionBar
    bulk_selected_one: '{count} memory selected',
    bulk_selected_other: '{count} memories selected',
    bulk_add_tag: 'Add tag',
    bulk_change_type: 'Change type',
    bulk_deselect: 'Deselect all',
    bulk_confirm_delete: 'Really delete {count} memory(ies)?',
    bulk_prompt_tag: 'Enter the tag to add:',
    bulk_prompt_type: 'Enter the new type:',

    // FilterPanel
    filter_button: 'Filters',
    filter_all_types: 'All types',
    filter_date_from: 'Start date',
    filter_date_to: 'End date',
    filter_quality_min: 'Min quality ({value})',
    filter_quality_max: 'Max quality ({value})',
    filter_apply: 'Apply',
    filter_reset: 'Reset',

    // Pagination
    page_previous: 'Previous',
    page_next: 'Next',
    page_label: 'Page',
    page_aria_prev: 'Previous page',
    page_aria_next: 'Next page',

    // UsageChart
    usage_creations: 'Creations',
    usage_accesses: 'Accesses',
    usage_empty: 'No data available.',
    usage_tooltip_creations: '{date} \u2014 Creations: {count}',
    usage_tooltip_accesses: '{date} \u2014 Accesses: {count}',
  },

  fr: {
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_timeline: 'Timeline',
    nav_memories: 'Memoires',
    nav_duplicates: 'Doublons',
    nav_tags: 'Tags',
    nav_stale: 'Obsoletes',
    nav_embeddings: 'Embeddings',
    nav_clusters: 'Clusters',
    nav_graph: 'Graphe',

    // Common
    loading: 'Chargement...',
    error_generic: 'Erreur',
    delete: 'Supprimer',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    saving: 'Sauvegarde...',
    edit: 'Modifier',
    type: 'Type',
    tags: 'Tags',

    // Dashboard
    dash_total_memories: 'Memoires totales',
    dash_distinct_types: 'Types distincts',
    dash_unique_tags: 'Tags uniques',
    dash_total_accesses: 'Acces totaux',
    dash_type_distribution: 'Repartition par type',
    dash_top_tags: 'Tags les plus utilises',
    dash_top_accessed: 'Memoires les plus consultees',
    dash_usage_stats: 'Statistiques d\'utilisation',
    dash_period_day: 'Jour',
    dash_period_week: 'Semaine',
    dash_period_month: 'Mois',
    dash_import_export: 'Import / Export',
    dash_export_json: 'Exporter (JSON)',
    dash_import_json: 'Importer (JSON)',
    dash_error_stats: 'Erreur lors du chargement des statistiques.',
    dash_error_export: 'Erreur lors de l\'export.',
    dash_error_import: 'Erreur lors de l\'import. Verifiez le format du fichier.',
    dash_import_result: 'Import termine : {imported} importees, {skipped} ignorees.',
    dash_error_loading: 'Erreur lors du chargement.',

    // Timeline
    timeline_title: 'Timeline',
    timeline_empty: 'Aucune memoire dans la timeline.',
    timeline_error: 'Erreur lors du chargement de la timeline.',
    timeline_count_one: '{count} memoire',
    timeline_count_other: '{count} memoires',

    // MemoryList
    ml_search_semantic: 'Recherche semantique...',
    ml_search_text: 'Rechercher dans les memoires...',
    ml_mode_text: 'Texte',
    ml_mode_vector: 'Vectoriel',
    ml_aria_text_search: 'Recherche texte',
    ml_aria_vector_search: 'Recherche vectorielle',
    ml_col_content: 'Contenu',
    ml_col_quality: 'Qualite',
    ml_col_score: 'Score',
    ml_col_date: 'Date',
    ml_no_results: 'Aucune memoire trouvee.',
    ml_filter_count_one: '{count} filtre actif',
    ml_filter_count_other: '{count} filtres actifs',
    ml_select_all: 'Selectionner tout',
    ml_error: 'Erreur lors du chargement des memoires.',

    // MemoryDetail
    md_back: '\u2190 Retour a la liste',
    md_confirm_delete: 'Confirmer suppression',
    md_aria_memory_type: 'Type de memoire',
    md_aria_memory_content: 'Contenu de la memoire',
    md_tags_label: 'Tags (separes par virgule) :',
    md_error_save: 'Erreur lors de la sauvegarde.',
    md_not_found: 'Memoire non trouvee ou erreur de chargement.',
    md_created: 'Cree le',
    md_modified: 'Modifie le',
    md_hash: 'Hash',
    md_accesses: 'Acces',
    md_associations: 'Associations',
    md_linked_hash: 'Hash lie',
    md_similarity: 'Similarite',

    // Duplicates
    dup_title: 'Detection de doublons',
    dup_threshold: 'Seuil de similarite :',
    dup_none: 'Aucun doublon detecte avec ce seuil.',
    dup_keep: 'Garder',
    dup_ignore: 'Ignorer',
    dup_groups: '{count} groupes',
    dup_error_delete: 'Erreur lors de la suppression',

    // Tags
    tags_title: 'Gestion des tags',
    tags_count: '{count} tags',
    tags_col_uses: 'Utilisations',
    tags_col_actions: 'Actions',
    tags_rename: 'Renommer',
    tags_merge: 'Fusionner',
    tags_empty: 'Aucun tag trouve.',
    tags_confirm_delete: 'Supprimer le tag "{tag}" ?',
    tags_merge_prompt: 'Nom du tag cible :',

    // Stale
    stale_title: 'Memoires obsoletes',
    stale_count: '{count} memoires obsoletes',
    stale_age_label: 'Age minimum (jours) :',
    stale_days: '{days} j',
    stale_quality_label: 'Qualite max :',
    stale_delete_all: 'Tout supprimer',
    stale_empty: 'Aucune memoire obsolete trouvee.',
    stale_confirm_delete: 'Supprimer {count} memoires obsoletes ?',
    stale_quality: 'Qualite:',

    // EmbeddingView
    emb_title: 'Espace vectoriel',
    emb_points: '{count} points',
    emb_neighbors: 'Voisins (n_neighbors)',
    emb_aria_neighbors: 'Voisins',
    emb_min_dist: 'Distance min (min_dist)',
    emb_aria_min_dist: 'Distance minimale',
    emb_empty: 'Aucun point a afficher.',
    emb_error: 'Erreur lors du chargement de la projection.',

    // ClusterView
    cl_title: 'Clusters semantiques',
    cl_count: '{count} clusters',
    cl_threshold: 'Seuil (threshold)',
    cl_aria_threshold: 'Seuil',
    cl_min_size: 'Taille min (min_size)',
    cl_aria_min_size: 'Taille minimale',
    cl_memories: '{count} memoires',
    cl_similarity: 'Similarite :',
    cl_empty: 'Aucun cluster trouve avec ces parametres.',
    cl_error: 'Erreur lors du chargement des clusters.',

    // GraphView
    graph_title: 'Graphe d\'associations',
    graph_stats: '{nodes} noeuds, {links} liens',
    graph_empty: 'Aucune association trouvee dans le graphe.',
    graph_error: 'Erreur lors du chargement du graphe.',

    // KeyboardHelp
    kb_title: 'Raccourcis clavier',
    kb_next_line: 'Ligne suivante',
    kb_prev_line: 'Ligne precedente',
    kb_focus_search: 'Focus recherche',
    kb_open_detail: 'Ouvrir le detail',
    kb_close: 'Fermer / deselectionner',
    kb_show_help: 'Afficher cette aide',

    // BulkActionBar
    bulk_selected_one: '{count} memoire selectionnee',
    bulk_selected_other: '{count} memoires selectionnees',
    bulk_add_tag: 'Ajouter tag',
    bulk_change_type: 'Changer type',
    bulk_deselect: 'Deselectionner tout',
    bulk_confirm_delete: 'Voulez-vous vraiment supprimer {count} memoire(s) ?',
    bulk_prompt_tag: 'Entrez le tag a ajouter :',
    bulk_prompt_type: 'Entrez le nouveau type :',

    // FilterPanel
    filter_button: 'Filtres',
    filter_all_types: 'Tous les types',
    filter_date_from: 'Date debut',
    filter_date_to: 'Date fin',
    filter_quality_min: 'Qualite min ({value})',
    filter_quality_max: 'Qualite max ({value})',
    filter_apply: 'Appliquer',
    filter_reset: 'Reinitialiser',

    // Pagination
    page_previous: 'Precedent',
    page_next: 'Suivant',
    page_label: 'Page',
    page_aria_prev: 'Page precedente',
    page_aria_next: 'Page suivante',

    // UsageChart
    usage_creations: 'Creations',
    usage_accesses: 'Acces',
    usage_empty: 'Aucune donnee disponible.',
    usage_tooltip_creations: '{date} \u2014 Creations: {count}',
    usage_tooltip_accesses: '{date} \u2014 Acces: {count}',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
