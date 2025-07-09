import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st
from wordcloud import WordCloud

def generate_wordcloud(text):
    wc = WordCloud(width=800, height=400, background_color='white').generate(text)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wc, interpolation='bilinear')
    ax.axis('off')
    ax.set_title("Word Cloud of Uploaded Abstracts", fontsize=14)
    st.pyplot(fig)

def plot_tag_distribution(df):
    tag_sums = df.sum().sort_values(ascending=True)  # Ascending for horizontal bars

    fig, ax = plt.subplots(figsize=(10, 8))

    sns.barplot(x=tag_sums.values, y=tag_sums.index, palette="crest", ax=ax)

    ax.set_title("📊 Predicted Tag Frequency", fontsize=16, weight='bold')
    ax.set_xlabel("Frequency", fontsize=12)
    ax.set_ylabel("Tag", fontsize=12)
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.bar_label(ax.containers[0], fmt='%.0f', padding=3)

    st.pyplot(fig)
