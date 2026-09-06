import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Download,
} from "lucide-react-native";
import { useAppConfigStore } from "../stores/appConfigStore";
import { useAuthStore } from "../stores/authStore";
import { getSessionToken } from "../utils/tokenStorage";
import type { MessageAttachment } from "../types";

export interface AttachmentListProps {
  messageId: string;
  attachments: MessageAttachment[];
}

/**
 * Format bytes into human readable format (KB, MB, GB).
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get icon for attachment content type.
 */
function getAttachmentIcon(contentType: string) {
  const type = contentType.toLowerCase();
  if (type.startsWith("image/")) {
    return <FileImage size={20} color="#38bdf8" />;
  }
  if (type.includes("pdf")) {
    return <FileText size={20} color="#f87171" />;
  }
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) {
    return <FileSpreadsheet size={20} color="#4ade80" />;
  }
  if (type.includes("zip") || type.includes("tar") || type.includes("rar")) {
    return <FileArchive size={20} color="#fbbf24" />;
  }
  return <File size={20} color="#94a3b8" />;
}

export default function AttachmentList({
  messageId,
  attachments,
}: AttachmentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const serverUrl = useAppConfigStore((s) => s.serverUrl);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleOpenAttachment = async (attachment: MessageAttachment) => {
    if (!serverUrl) {
      Alert.alert("Error", "Server URL not configured");
      return;
    }

    try {
      setDownloadingId(attachment.id);

      // Retrieve session token
      let token = useAuthStore.getState().sessionToken;
      if (!token) {
        token = await getSessionToken();
      }

      if (!token) {
        Alert.alert("Authentication Error", "Please sign in to download attachments.");
        return;
      }

      const fileUrl = `${serverUrl}/api/messages/${messageId}/attachments/${attachment.id}?download=1`;
      const cleanFilename = attachment.filename.replace(/[/\\?%*:|"<>]/g, "_");
      const destination = new ExpoFile(Paths.cache, cleanFilename);

      // Download file with authentication header
      const downloadedFile = await ExpoFile.downloadFileAsync(fileUrl, destination, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        idempotent: true,
      });

      // Check if sharing is available and open native sheet
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadedFile.uri, {
          UTI: attachment.contentType,
          mimeType: attachment.contentType,
          dialogTitle: attachment.filename,
        });
      } else {
        Alert.alert("Downloaded", `Saved to: ${downloadedFile.uri}`);
      }
    } catch (error) {
      console.error("Failed to open attachment:", error);
      Alert.alert(
        "Attachment Error",
        error instanceof Error ? error.message : "Failed to download attachment"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Attachments ({attachments.length})
      </Text>

      <View style={styles.list}>
        {attachments.map((att) => {
          const isDownloading = downloadingId === att.id;

          return (
            <TouchableOpacity
              key={att.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleOpenAttachment(att)}
              disabled={isDownloading}
            >
              <View style={styles.iconContainer}>
                {getAttachmentIcon(att.contentType)}
              </View>

              <View style={styles.metaContainer}>
                <Text style={styles.filename} numberOfLines={1}>
                  {att.filename}
                </Text>
                <Text style={styles.filesize}>
                  {formatFileSize(att.size)}
                </Text>
              </View>

              <View style={styles.actionContainer}>
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Download size={18} color="#64748b" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1e202e",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: {
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#13141f",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#23263a",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#1a1d2d",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  metaContainer: {
    flex: 1,
    justifyContent: "center",
  },
  filename: {
    fontSize: 14,
    color: "#f1f5f9",
    fontWeight: "500",
    marginBottom: 2,
  },
  filesize: {
    fontSize: 12,
    color: "#64748b",
  },
  actionContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
