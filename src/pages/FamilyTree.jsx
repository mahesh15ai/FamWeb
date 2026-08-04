import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GitBranch,
  Plus,
  Trash2,
  Heart,
  Users2,
  Loader2,
  X,
} from "lucide-react";
import * as familyTreeApi from "../api/familyTree";
import * as membershipApi from "../api/membership";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ?? "";

function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
}

const RELATIONSHIP_LABELS = {
  PARENT: "Parent of",
  SPOUSE: "Spouse of",
  SIBLING: "Sibling of",
};

/**
 * Groups nodes into generations using PARENT edges. Nodes with no
 * incoming CHILD edge (i.e. nobody is their parent) start at
 * generation 0; everyone else is one generation below their parent.
 * This is a best-effort layout, not a strict genealogical algorithm —
 * cycles or missing links just fall back to generation 0.
 */
function computeGenerations(nodes, edges) {
  const parentOf = {}; // childId -> [parentId, ...]
  edges.forEach((e) => {
    if (e.type === "PARENT") {
      parentOf[e.to_id] = parentOf[e.to_id] || [];
      parentOf[e.to_id].push(e.from_id);
    }
  });

  const generation = {};
  const visiting = new Set();

  function resolve(nodeId, depth = 0) {
    if (generation[nodeId] !== undefined) return generation[nodeId];
    if (visiting.has(nodeId) || depth > 20) return 0; // guard against cycles
    visiting.add(nodeId);

    const parents = parentOf[nodeId];
    if (!parents || parents.length === 0) {
      generation[nodeId] = 0;
    } else {
      const parentGens = parents.map((pId) => resolve(pId, depth + 1));
      generation[nodeId] = Math.max(...parentGens) + 1;
    }
    visiting.delete(nodeId);
    return generation[nodeId];
  }

  nodes.forEach((n) => resolve(n.id));
  return generation;
}

export default function FamilyTree() {
  const navigate = useNavigate();
  const toast = useToast();

  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [relationships, setRelationships] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ from_member: "", to_member: "", relationship_type: "PARENT" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [graphData, relData, membersData] = await Promise.all([
        familyTreeApi.getFamilyTreeGraph(),
        familyTreeApi.listRelationships(),
        membershipApi.listMembers(),
      ]);
      setGraph(graphData);
      setRelationships(Array.isArray(relData) ? relData : relData?.results ?? []);
      setMembers(Array.isArray(membersData) ? membersData : membersData?.results ?? []);
    } catch {
      toast.error("Couldn't load the family tree.");
    } finally {
      setLoading(false);
    }
  }

  const generationMap = useMemo(
    () => computeGenerations(graph.nodes, graph.edges),
    [graph]
  );

  const generationRows = useMemo(() => {
    const rows = {};
    graph.nodes.forEach((node) => {
      const gen = generationMap[node.id] ?? 0;
      rows[gen] = rows[gen] || [];
      rows[gen].push(node);
    });
    return Object.keys(rows)
      .map(Number)
      .sort((a, b) => a - b)
      .map((gen) => ({ gen, members: rows[gen] }));
  }, [graph.nodes, generationMap]);

  // Spouse pairs, so we can render them side-by-side with a heart connector
  const spousePairs = useMemo(() => {
    const pairs = new Set();
    graph.edges
      .filter((e) => e.type === "SPOUSE")
      .forEach((e) => {
        const key = [e.from_id, e.to_id].sort((a, b) => a - b).join("-");
        pairs.add(key);
      });
    return pairs;
  }, [graph.edges]);

  function isSpouseOf(a, b) {
    return spousePairs.has([a, b].sort((x, y) => x - y).join("-"));
  }

  async function handleAddRelationship(e) {
    e.preventDefault();
    setFormError("");

    if (!form.from_member || !form.to_member) {
      setFormError("Select both members.");
      return;
    }
    if (form.from_member === form.to_member) {
      setFormError("A member can't have a relationship with themself.");
      return;
    }

    setIsSubmitting(true);
    try {
      await familyTreeApi.createRelationship({
        from_member: Number(form.from_member),
        to_member: Number(form.to_member),
        relationship_type: form.relationship_type,
      });
      toast.success("Relationship added.");
      setForm({ from_member: "", to_member: "", relationship_type: "PARENT" });
      setShowAddForm(false);
      loadAll();
    } catch (err) {
      const data = err.response?.data;
      const message = data?.detail || "Couldn't add that relationship.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this relationship?")) return;
    setDeletingId(id);
    try {
      await familyTreeApi.deleteRelationship(id);
      toast.success("Relationship removed.");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Couldn't remove relationship.");
    } finally {
      setDeletingId(null);
    }
  }

  function memberLabel(m) {
    return m.user_full_name?.trim() || m.user_email?.split("@")[0] || `Member #${m.id}`;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <GitBranch size={22} className="text-brand-600" />
              Family Tree
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              See how everyone in your family is connected.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((s) => !s)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-brand-500 text-white rounded-lg px-4 py-2 hover:bg-brand-600 transition-colors"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? "Cancel" : "Add relationship"}
          </button>
        </div>

        {/* Add relationship form */}
        {showAddForm && (
          <form
            onSubmit={handleAddRelationship}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                From
                <select
                  value={form.from_member}
                  onChange={(e) => setForm({ ...form, from_member: e.target.value })}
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">Select member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                Relationship
                <select
                  value={form.relationship_type}
                  onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="PARENT">is the Parent of →</option>
                  <option value="SPOUSE">is the Spouse of</option>
                  <option value="SIBLING">is the Sibling of</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                To
                <select
                  value={form.to_member}
                  onChange={(e) => setForm({ ...form, to_member: e.target.value })}
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">Select member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start flex items-center gap-2 rounded-lg bg-brand-500 text-white font-semibold px-4 py-2 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {isSubmitting ? "Saving…" : "Save relationship"}
            </button>
          </form>
        )}

        {/* Visual tree */}
        {loading && (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-sm text-stone-500 animate-pulse">
            Loading family tree…
          </div>
        )}

        {!loading && graph.nodes.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
            <Users2 size={28} className="mx-auto text-stone-300 mb-2" />
            <p className="text-sm text-stone-500">No family members to show yet.</p>
          </div>
        )}

        {!loading && graph.nodes.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-x-auto">
            <div className="flex flex-col gap-10 min-w-max">
              {generationRows.map(({ gen, members: rowMembers }) => {
                // group consecutive spouse pairs together so they render side by side
                const rendered = new Set();
                const groups = [];
                rowMembers.forEach((node) => {
                  if (rendered.has(node.id)) return;
                  const spouse = rowMembers.find(
                    (other) => other.id !== node.id && !rendered.has(other.id) && isSpouseOf(node.id, other.id)
                  );
                  if (spouse) {
                    groups.push([node, spouse]);
                    rendered.add(node.id);
                    rendered.add(spouse.id);
                  } else {
                    groups.push([node]);
                    rendered.add(node.id);
                  }
                });

                return (
                  <div key={gen} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Generation {gen + 1}
                    </span>
                    <div className="flex items-start gap-8">
                      {groups.map((group, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          {group.map((node, i) => {
                            const photoUrl = resolveMediaUrl(node.profile_photo);
                            return (
                              <>
                                {i > 0 && <Heart size={14} className="text-rose-400 shrink-0" fill="currentColor" />}
                                <div
                                  key={node.id}
                                  className="flex flex-col items-center w-24 text-center"
                                  title={node.name}
                                >
                                  {photoUrl ? (
                                    <img
                                      src={photoUrl}
                                      alt={node.name}
                                      className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                                      {node.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                  )}
                                  <p className="text-xs font-semibold text-stone-800 mt-1.5 truncate w-full">
                                    {node.name}
                                  </p>
                                  <p className="text-[10px] text-stone-400 capitalize">
                                    {node.role.toLowerCase()}
                                  </p>
                                </div>
                              </>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Relationship management list */}
        {!loading && relationships.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              All recorded relationships
            </h2>
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
              {relationships.map((rel) => (
                <div key={rel.id} className="p-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-stone-700">
                    <span className="font-semibold text-stone-900">{rel.from_member_name}</span>{" "}
                    <span className="text-stone-400">{RELATIONSHIP_LABELS[rel.relationship_type]}</span>{" "}
                    <span className="font-semibold text-stone-900">{rel.to_member_name}</span>
                  </p>
                  <button
                    onClick={() => handleDelete(rel.id)}
                    disabled={deletingId === rel.id}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove relationship"
                  >
                    {deletingId === rel.id ? (
                      <Loader2 size={15} className="animate-spin text-red-600" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}