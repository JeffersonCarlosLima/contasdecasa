"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDropzone } from "./FileDropzone";
import { MappingStep } from "./MappingStep";
import { validateFile } from "./helpers";
import type { MappingConfig, NeedsMappingData, UploadFormProps } from "./types";
import { saveMapping, uploadStatement } from "../actions";

export function UploadForm({
  currentMember,
  paymentMethods,
  members,
}: UploadFormProps) {
  const router = useRouter();
  const ownerSelectId = useId();
  const paymentMethodSelectId = useId();

  const [step, setStep] = useState<"upload" | "mapping">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const isAdminOrOwner =
    currentMember.role === "admin" || currentMember.role === "dono";

  // Membro comum só pode importar para si mesmo; admin/dono pode escolher a si, outro ou Família
  const [ownerMemberId, setOwnerMemberId] = useState<string>(
    isAdminOrOwner ? "familia" : currentMember.id
  );

  const [paymentMethodId, setPaymentMethodId] = useState<string>(
    paymentMethods[0]?.id ?? ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");
  const [mappingError, setMappingError] = useState<string>("");

  const [needsMappingData, setNeedsMappingData] = useState<NeedsMappingData | null>(null);

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    setGeneralError("");
    if (!newFile) {
      setFileError("");
      return;
    }
    const validation = validateFile(newFile);
    if (!validation.valid) {
      setFileError(validation.error || "Arquivo inválido.");
    } else {
      setFileError("");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!file) {
      setFileError("Selecione um arquivo .csv para continuar.");
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error || "Arquivo inválido.");
      return;
    }

    if (!paymentMethodId) {
      setGeneralError("Selecione uma forma de pagamento.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("paymentMethodId", paymentMethodId);
      formData.append("ownerMemberId", ownerMemberId);

      const result = await uploadStatement(formData);

      if (result.ok) {
        router.push(`/importar/${result.batchId}`);
        return;
      }

      if ("needsMapping" in result && result.needsMapping) {
        setNeedsMappingData({
          headers: result.headers,
          sample: result.sample,
        });
        setStep("mapping");
        setIsSubmitting(false);
        return;
      }

      if ("error" in result) {
        setGeneralError(result.error || "Erro ao processar o extrato.");
      } else {
        setGeneralError("Erro ao processar o extrato.");
      }
    } catch {
      setGeneralError("Ocorreu um erro ao enviar o arquivo. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMappingSubmit = async (config: MappingConfig, name: string) => {
    if (!file) {
      setMappingError("Arquivo não encontrado. Volte e selecione o arquivo novamente.");
      return;
    }

    setIsSubmitting(true);
    setMappingError("");

    try {
      // 1. Salvar configuração de mapeamento
      const mapRes = await saveMapping({
        name,
        config,
      });

      if (!mapRes.ok) {
        setMappingError(mapRes.error || "Erro ao salvar modelo de extrato.");
        setIsSubmitting(false);
        return;
      }

      // 2. Reenviar o arquivo com o mappingId
      const formData = new FormData();
      formData.append("file", file);
      formData.append("paymentMethodId", paymentMethodId);
      formData.append("ownerMemberId", ownerMemberId);
      formData.append("mappingId", mapRes.mappingId);

      const uploadRes = await uploadStatement(formData);

      if (uploadRes.ok) {
        router.push(`/importar/${uploadRes.batchId}`);
        return;
      }

      if ("error" in uploadRes) {
        setMappingError(uploadRes.error || "Erro ao processar o extrato com o novo modelo.");
      } else {
        setMappingError("Erro ao processar o extrato com o novo modelo.");
      }
    } catch {
      setMappingError("Ocorreu um erro ao processar o extrato. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "mapping" && needsMappingData) {
    return (
      <MappingStep
        headers={needsMappingData.headers}
        sample={needsMappingData.sample}
        onSubmit={handleMappingSubmit}
        onBack={() => {
          setStep("upload");
          setMappingError("");
        }}
        isSubmitting={isSubmitting}
        error={mappingError}
      />
    );
  }

  return (
    <form
      className="cc-card"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
      onSubmit={handleUploadSubmit}
    >
      <div>
        <h2 className="title" style={{ margin: "0 0 4px 0" }}>
          Enviar extrato bancário
        </h2>
        <span className="body cc-muted">
          Envie o arquivo .csv gerado pelo seu banco. Você poderá revisar todas as linhas antes de qualquer lançamento ser criado.
        </span>
      </div>

      {generalError && (
        <div
          role="alert"
          className="cc-field__hint cc-field__hint--error"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            backgroundColor: "var(--danger-subtle, #fde8e8)",
            borderRadius: "var(--radius-md, 8px)",
          }}
        >
          {generalError}
        </div>
      )}

      {/* Seleção do Arquivo */}
      <FileDropzone
        file={file}
        onFileSelect={handleFileChange}
        error={fileError}
        disabled={isSubmitting}
      />

      <div className="cc-form">
        {/* Dono do Extrato */}
        <label className="cc-field" htmlFor={ownerSelectId}>
          <span className="cc-field__label">Responsável padrão</span>
          {isAdminOrOwner ? (
            <select
              id={ownerSelectId}
              className="cc-select"
              style={{ height: 44 }}
              value={ownerMemberId}
              disabled={isSubmitting}
              onChange={(e) => setOwnerMemberId(e.target.value)}
            >
              <option value="familia">Família (dividir no rateio)</option>
              <option value={currentMember.id}>
                {currentMember.displayName} (você)
              </option>
              {members
                .filter((m) => m.id !== currentMember.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
            </select>
          ) : (
            <>
              <select
                id={ownerSelectId}
                className="cc-select"
                style={{ height: 44 }}
                value={currentMember.id}
                disabled
              >
                <option value={currentMember.id}>
                  {currentMember.displayName} (você)
                </option>
              </select>
              <span className="cc-field__hint">
                Membros comuns importam extratos atribuídos a si mesmos.
              </span>
            </>
          )}
        </label>

        {/* Forma de Pagamento */}
        <label className="cc-field" htmlFor={paymentMethodSelectId}>
          <span className="cc-field__label">Conta ou Cartão</span>
          {paymentMethods.length === 0 ? (
            <>
              <select
                id={paymentMethodSelectId}
                className="cc-select"
                style={{ height: 44 }}
                disabled
              >
                <option value="">Nenhuma forma cadastrada</option>
              </select>
              <span className="cc-field__hint cc-field__hint--error">
                Cadastre uma conta ou cartão em Tipos e Formas antes de importar.
              </span>
            </>
          ) : (
            <select
              id={paymentMethodSelectId}
              className="cc-select"
              style={{ height: 44 }}
              value={paymentMethodId}
              disabled={isSubmitting}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      <div className="cc-formfoot cc-actions--wide">
        <button
          type="submit"
          className="cc-btn cc-btn--primary"
          disabled={isSubmitting || !file || Boolean(fileError) || paymentMethods.length === 0}
        >
          {isSubmitting ? "Enviando e processando…" : "Enviar e processar"}
        </button>
      </div>
    </form>
  );
}
